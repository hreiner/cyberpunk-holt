"""Registre local versionné et journal des opérations du studio."""
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

KINDS = {'project', 'scene', 'shot', 'character', 'asset', 'audio', 'task'}
TRANSITIONS = {
    'queued': {'running', 'cancelled'},
    'running': {'review', 'failed', 'cancelled', 'interrupted'},
    'interrupted': {'cancelled'},
    'failed': set(), 'cancelled': set(),
    'review': {'approved', 'rejected'}, 'approved': set(), 'rejected': set(),
}


def now():
    return datetime.now(timezone.utc).isoformat()


class Registry:
    def __init__(self, path):
        self.db = sqlite3.connect(path, timeout=30)
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS objects (
          kind TEXT NOT NULL, id TEXT NOT NULL, version INTEGER NOT NULL,
          data TEXT NOT NULL, created TEXT NOT NULL, PRIMARY KEY(kind,id,version));
        CREATE TABLE IF NOT EXISTS attempts (
          id TEXT PRIMARY KEY, task_id TEXT NOT NULL, task_version INTEGER NOT NULL,
          provider TEXT NOT NULL, provider_id TEXT, parameters TEXT NOT NULL,
          estimated INTEGER NOT NULL CHECK(estimated >= 0), currency TEXT NOT NULL,
          created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS events (
          seq INTEGER PRIMARY KEY AUTOINCREMENT, attempt_id TEXT NOT NULL REFERENCES attempts(id),
          state TEXT NOT NULL, details TEXT NOT NULL, created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS budget (id INTEGER PRIMARY KEY CHECK(id=1),
          ceiling INTEGER NOT NULL CHECK(ceiling >= 0), currency TEXT NOT NULL);
        ''')
        self.db.commit()

    def close(self):
        self.db.close()

    def put(self, kind, object_id, data):
        if kind not in KINDS or not object_id or not isinstance(data, dict):
            raise ValueError('Objet invalide')
        with self.db:
            version = self.db.execute('SELECT COALESCE(MAX(version),0)+1 FROM objects WHERE kind=? AND id=?', (kind, object_id)).fetchone()[0]
            self.db.execute('INSERT INTO objects VALUES (?,?,?,?,?)', (kind, object_id, version, json.dumps(data, ensure_ascii=False), now()))
        return version

    def get(self, kind, object_id, version=None):
        row = self.db.execute('SELECT version,data FROM objects WHERE kind=? AND id=? AND (? IS NULL OR version=?) ORDER BY version DESC LIMIT 1', (kind, object_id, version, version)).fetchone()
        if not row:
            raise ValueError('Objet introuvable')
        return {'kind': kind, 'id': object_id, 'version': row[0], 'data': json.loads(row[1])}

    def budget(self, ceiling, currency):
        if not isinstance(ceiling, int) or ceiling < 0 or not currency:
            raise ValueError('Budget invalide')
        with self.db:
            prior = self.db.execute('SELECT DISTINCT currency FROM attempts').fetchall()
            if any(row[0] != currency for row in prior):
                raise ValueError('Devise incompatible avec les tentatives')
            self.db.execute('INSERT OR REPLACE INTO budget VALUES (1,?,?)', (ceiling, currency))

    def start(self, task_id, task_version, provider, parameters, estimated, currency, external=False, retry_of=None):
        # No external adapter can be called through this release, irrespective of budget.
        if external:
            raise PermissionError('Opération externe désactivée : autorisation et adaptateur absents')
        if not isinstance(estimated, int) or estimated < 0:
            raise ValueError('Estimation invalide')
        self.get('task', task_id, task_version)
        if retry_of:
            prior = self.db.execute('SELECT task_id, task_version FROM attempts WHERE id=?', (retry_of,)).fetchone()
            if prior != (task_id, task_version):
                raise ValueError('Tentative précédente incompatible')
            parameters = {**parameters, 'retry_of': retry_of}
        attempt = str(uuid.uuid4())
        try:
            self.db.execute('BEGIN IMMEDIATE')
            budget = self.db.execute('SELECT ceiling,currency FROM budget WHERE id=1').fetchone()
            if not budget or budget[1] != currency:
                raise ValueError('Budget ou devise absent')
            # Réserver chaque estimation jusqu'à un coût réel connu, même après échec.
            rows = self.db.execute('SELECT id,estimated FROM attempts').fetchall()
            total = 0
            for aid, estimate in rows:
                costs = self.db.execute('SELECT details FROM events WHERE attempt_id=? ORDER BY seq DESC', (aid,)).fetchall()
                actual = next((json.loads(row[0])['actual'] for row in costs if 'actual' in json.loads(row[0])), None)
                total += estimate if actual is None else actual
            if total + estimated > budget[0]:
                raise ValueError('Plafond dépassé')
            self.db.execute('INSERT INTO attempts VALUES (?,?,?,?,?,?,?,?,?)', (attempt, task_id, task_version, provider, None, json.dumps(parameters, ensure_ascii=False), estimated, currency, now()))
            self.db.execute('INSERT INTO events(attempt_id,state,details,created) VALUES (?,?,?,?)', (attempt, 'queued', '{}', now()))
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return attempt

    def transition(self, attempt, state, details=None):
        details = details or {}
        if 'actual' in details and (not isinstance(details['actual'], int) or details['actual'] < 0):
            raise ValueError('Coût réel invalide')
        try:
            self.db.execute('BEGIN IMMEDIATE')
            row = self.db.execute('SELECT state FROM events WHERE attempt_id=? ORDER BY seq DESC LIMIT 1', (attempt,)).fetchone()
            if not row or state not in TRANSITIONS[row[0]]:
                raise ValueError('Transition interdite')
            self.db.execute('INSERT INTO events(attempt_id,state,details,created) VALUES (?,?,?,?)', (attempt, state, json.dumps(details, ensure_ascii=False), now()))
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def history(self, attempt):
        return [{'state': row[0], 'details': json.loads(row[1]), 'created': row[2]} for row in self.db.execute('SELECT state,details,created FROM events WHERE attempt_id=? ORDER BY seq', (attempt,))]

import importlib, sys
def dynamic_import(absolute_package_str, key):
    """Blender extensions live at unknown module paths; find MPFB by suffix."""
    for amod in sys.modules:
        if amod.endswith(absolute_package_str):
            mod = importlib.import_module(amod)
            if not hasattr(mod, key):
                raise AttributeError(f"Module {amod} does not have attribute {key}")
            return getattr(mod, key)
    raise ValueError(f"No module found with name ending in {absolute_package_str}")

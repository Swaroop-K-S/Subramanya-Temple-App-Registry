
# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_all, collect_data_files

datas = [
    ('../star-frontend/dist', 'static'),
    ('app/printer_config.json', 'app'),
]

# Radical Fix: Collect everything for jaraco.text
tmp_datas, tmp_binaries, tmp_hiddenimports = collect_all('jaraco.text')
datas += tmp_datas
datas += collect_data_files('jaraco.text') # Ensure data is picked up even if collect_all checks package

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=tmp_binaries,
    datas=datas,
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'sqlalchemy.sql.default_comparator',
        'engineio.async_drivers.asgi',
        'passlib.handlers.pbkdf2',
        'passlib.handlers.bcrypt',
        'multipart',
        'jaraco.text',
        'jaraco.functools',
        'jaraco.context',
    ] + tmp_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'psycopg2', 'psycopg2-binary', 
        'matplotlib', 'tkinter', 'unittest', 'pydoc', 'pdb',
        'torch', 'nltk', 'pandas', 'scipy', 'numpy'
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='subramanya_temple_app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # Hidden - clean Windows app experience
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='app_icon.ico' if 'app_icon.ico' in a.datas else None # Optional icon
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='subramanya_temple_app',
)

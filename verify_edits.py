import os

base = r'D:\WORKBODY\国内外视频表单\shoot-system\src'

checks = {
    'globals.css tokens': (os.path.join(base, 'app', 'globals.css'), [
        '--primary: var(--brand-500)',
        '--color-text-muted: var(--ink-4)',
        '--color-border: var(--border-default)',
        '.card { overflow-x: auto',
    ]),
    'App.tsx TasksPage': (os.path.join(base, 'components', 'App.tsx'), [
        'TasksPage } from',
        'tasks: Camera',
        'modal-box ${className',
        "case '#/tasks'",
        "path: '#/tasks'",
    ]),
    'pages.tsx fixes': (os.path.join(base, 'components', 'pages.tsx'), [
        "user.username === 'guest'",
        'type: form.category',
        'type: form.type',
        "submitterName: '', submitterDept",
    ]),
    'demands route (dead block removed)': (os.path.join(base, 'app', 'api', 'demands', 'route.ts'), [
        'similar',  # should be MISS
    ]),
    'sessions route seq': (os.path.join(base, 'app', 'api', 'sessions', 'route.ts'), [
        'let taskSeq',
        'taskSeq++',
    ]),
}

print('=== EDIT VERIFICATION ===')
for name, (f, subs) in checks.items():
    txt = open(f, encoding='utf-8').read()
    print('==', name)
    for s in subs:
        ok = s in txt
        # for demands route, 'similar' should be absent
        if name.startswith('demands route'):
            ok = not ok
            print('   ', 'OK ' if ok else 'MISS', '(expect absent)' , s[:40])
        else:
            print('   ', 'OK ' if ok else 'MISS', s[:50])

print()
print('=== INSTALL LOG TAIL ===')
try:
    print(open(r'D:\WORKBODY\国内外视频表单\shoot-system\install.log', encoding='utf-8', errors='replace').read()[-900:])
except Exception as e:
    print('no log:', e)

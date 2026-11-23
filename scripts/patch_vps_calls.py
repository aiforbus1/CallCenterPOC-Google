import sys

sp = 'services/api/app/schemas/call.py'
with open(sp, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('created_at: datetime', 'created_at: Optional[datetime] = None')
content = content.replace('updated_at: datetime', 'updated_at: Optional[datetime] = None')
with open(sp, 'w', encoding='utf-8') as f:
    f.write(content)
print('✓ schemas/call.py patched')

rp = 'services/api/app/api/v1/routes/calls.py'
with open(rp, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('created_at=c.created_at,', 'created_at=getattr(c, "created_at", None) or datetime.now(timezone.utc),')
content = content.replace('updated_at=c.updated_at,', 'updated_at=getattr(c, "updated_at", None) or datetime.now(timezone.utc),')
with open(rp, 'w', encoding='utf-8') as f:
    f.write(content)
print('✓ routes/calls.py patched')

import re, sys

with open(r'C:\Users\DELL\.gemini\antigravity\scratch\stockpilot\index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix 1: saveReceipt - replace Claude-specific download with universal Blob download
old_save = '''async function saveReceipt(s){
  try{
    const d=window.claude?await claude.use('downloads'):null;
    if(!d){say('T\u00e9l\u00e9chargement indisponible dans cette vue');return}
    await d.save({filename:s.no+'.pdf',data:pdfBytes(s)});
    say('Re\u00e7u '+s.no+' enregistr\u00e9 \u2713');
  }catch(e){if(!e||e.code!=='declined')say('Le re\u00e7u n\u2019a pas pu \u00eatre t\u00e9l\u00e9charg\u00e9')}
}'''

new_save = '''async function saveReceipt(s){
  try{
    if(!s||!s.items){say('Re\u00e7u non disponible pour cette vente');return}
    const bytes=pdfBytes(s);
    const blob=new Blob([bytes],{type:'application/pdf'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=s.no+'.pdf';
    document.body.appendChild(a);a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    say('Re\u00e7u '+s.no+' enregistr\u00e9 \u2713');
  }catch(e){say('Le re\u00e7u n\u2019a pas pu \u00eatre t\u00e9l\u00e9charg\u00e9')}
}'''

if old_save in c:
    c = c.replace(old_save, new_save)
    print("OK: saveReceipt fixed")
else:
    print("ERROR: saveReceipt old text not found")

with open(r'C:\Users\DELL\.gemini\antigravity\scratch\stockpilot\index.html', 'w', encoding='utf-8') as f:
    f.write(c)

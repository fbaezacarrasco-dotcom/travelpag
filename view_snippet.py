from pathlib import Path
text = Path('server.js').read_text()
start = text.index('    try {\r\n        const verification = await fetch')
end = text.index('\r\n\r\n    try {\r\n        const transporter', start)
print(repr(text[start:end]))

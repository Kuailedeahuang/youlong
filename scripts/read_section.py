import sys
f = open('js/scenes/sceneWithBackground.js', 'r', encoding='utf-8')
lines = f.readlines()
f.close()
print('Total lines:', len(lines))
start = int(sys.argv[1]) if len(sys.argv) > 1 else 50
end = int(sys.argv[2]) if len(sys.argv) > 2 else 150
for i in range(start, end):
    if i < len(lines):
        print(str(i+1) + ':' + lines[i], end='')

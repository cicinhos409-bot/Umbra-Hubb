import sys
def check_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    stack = []
    for i, char in enumerate(content):
        if char == '{':
            stack.append(i)
        elif char == '}':
            if not stack:
                print(f"Extra closing brace at position {i}")
                return False
            stack.pop()
    if stack:
        print(f"Unclosed opening brace(s) at positions {stack}")
        return False
    print("Braces are balanced.")
    return True

check_braces(sys.argv[1])

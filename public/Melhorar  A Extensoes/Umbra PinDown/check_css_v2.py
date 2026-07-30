import sys
import re

def check_css(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Basic brace balance check
    braces = 0
    for line_num, line in enumerate(content.splitlines(), 1):
        for char in line:
            if char == '{':
                braces += 1
            elif char == '}':
                braces -= 1
                if braces < 0:
                    print(f"Error: Extra closing brace at line {line_num}")
                    return False
    
    if braces != 0:
        print(f"Error: Unbalanced braces. Remaining: {braces}")
        return False
    
    # Check for missing semicolons (basic check)
    # This is hard because of nested rules and media queries, but let's try.
    # Actually, let's just use the brace check first.
    print("Braces are balanced.")
    return True

check_css(sys.argv[1])

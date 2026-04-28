import re
import os

def fix_all(error_log):
    if not os.path.exists(error_log):
        print(f"Error log {error_log} not found")
        return

    with open(error_log, 'r') as f:
        lines = f.readlines()

    # Match src/path/file.ts(line,col): error TS7006: Parameter 'name' implicitly has an 'any' type.
    pattern = re.compile(r'((?:src|lib|components)/[^(]+)\((\d+),(\d+)\): error TS7006: Parameter \'(\w+)\' implicitly has an \'any\' type\.')
    
    changes = {}
    for line in lines:
        match = pattern.search(line)
        if match:
            file_path, line_num, col_num, param_name = match.groups()
            file_path = file_path.lstrip('./')
            if file_path not in changes: changes[file_path] = []
            changes[file_path].append((int(line_num), int(col_num), param_name))

    for file_path, file_changes in changes.items():
        if not os.path.exists(file_path): 
            print(f"File not found: {file_path}")
            continue
        try:
            with open(file_path, 'r') as f: content = f.readlines()
            
            # Group by line
            line_changes = {}
            for l, c, p in file_changes:
                if l not in line_changes: line_changes[l] = []
                line_changes[l].append((c, p))
                
            for l in sorted(line_changes.keys(), reverse=True):
                idx = l - 1
                if idx >= len(content): continue
                
                orig_line = content[idx]
                # Sort changes in line by col in reverse
                line_errs = sorted(line_changes[l], key=lambda x: x[0], reverse=True)
                
                for c, p in line_errs:
                    c_idx = c - 1
                    if orig_line[c_idx:c_idx+len(p)] != p: 
                        print(f"Mismatch in {file_path}:{l}:{c} - expected '{p}', found '{orig_line[c_idx:c_idx+len(p)]}'")
                        continue
                    
                    # Check for existing parens
                    # Look back for '(' or ','
                    back = c_idx - 1
                    while back >= 0 and orig_line[back].isspace(): back -= 1
                    
                    has_parens = False
                    if back >= 0 and orig_line[back] in ('(', ','):
                        has_parens = True
                    
                    if has_parens:
                        # Add : any after parameter
                        orig_line = orig_line[:c_idx+len(p)] + ": any" + orig_line[c_idx+len(p):]
                    else:
                        # Wrap in (p: any)
                        orig_line = orig_line[:c_idx] + "(" + p + ": any)" + orig_line[c_idx+len(p):]
                
                content[idx] = orig_line
                
            with open(file_path, 'w') as f: f.writelines(content)
            print(f"Fixed {file_path}")
        except Exception as e:
            print(f"Failed {file_path}: {e}")

if __name__ == "__main__":
    fix_all('scratch/tsc_errors_full.txt')

const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Remove import ProfilePopup ...
            content = content.replace(/^import\s+ProfilePopup\s+from\s+['"].*?['"];?\r?\n/gm, '');

            // Remove <ProfilePopup ... />
            // Since it can be multiline, we can use a regex that matches <ProfilePopup up to />
            // and we also might want to remove the wrapping {showProfilePopup && ( ... )} if it exists for it.
            // But removing just <ProfilePopup ... /> is safer, then we might have {showProfilePopup && ( )} which might cause empty fragment or just boolean expression.
            // Let's remove the block: {showProfilePopup && ( <ProfilePopup ... /> )}
            content = content.replace(/\{showProfilePopup\s*&&\s*\(\s*<ProfilePopup[\s\S]*?\/>\s*\)\}/g, '');
            // Also if there's no wrapper or it's wrapped in { showProfilePopup && <ProfilePopup ... /> }
            content = content.replace(/\{showProfilePopup\s*&&\s*<ProfilePopup[\s\S]*?\/>\}/g, '');
            // If it's a standalone <ProfilePopup ... />
            content = content.replace(/<ProfilePopup[\s\S]*?\/>/g, '');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'Frontend/src/components/CustomizedEditor/Layouts'));
processDir(path.join(__dirname, 'Frontend/src/components/CustomizedEditor/Mobile/MobileLayouts'));

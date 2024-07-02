const vscode = require('vscode');
const axios = require('axios');

async function getCodeforcesSubmissions(handle) {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&count=5`);
        return response.data.result;
    } catch (error) {
        console.error('Failed to fetch Codeforces submissions:', error);
        throw error;
    }
}

async function changeStatusBarColor(themeName) {
    const themeConfig = vscode.workspace.getConfiguration('workbench');
    try {
        await themeConfig.update('colorTheme', themeName, vscode.ConfigurationTarget.Global);
    } catch (error) {
        console.error('Failed to change VS Code theme:', error);
        throw error;
    }
}

async function getHandle() {
    const config = vscode.workspace.getConfiguration('codeforces-notify');
    let handle = config.get('handle');

    if (!handle) {
        handle = await vscode.window.showInputBox({
            prompt: 'Please enter your Codeforces handle',
            ignoreFocusOut: true,
        });

        if (handle) {
            await config.update('handle', handle, vscode.ConfigurationTarget.Global);
        } else {
            vscode.window.showErrorMessage('Codeforces handle is required for the extension to work');
        }
    }

    return handle;
}

async function activate(context) {
    let lastSubmissionId = null;

    const handle = await getHandle();
    vscode.window.showInformationMessage(`Codeforces handle set to: ${handle}`);

    async function checkSubmissions() {
        try {
            const submissions = await getCodeforcesSubmissions(handle);
            
            if (submissions.length === 0) {
                return;
            }

            const latestSubmission = submissions[0];
            
            if (lastSubmissionId === null) {
                lastSubmissionId = latestSubmission.id;
            } else if (latestSubmission.verdict !== 'TESTING' && lastSubmissionId !== latestSubmission.id) {
                lastSubmissionId = latestSubmission.id;
                const verdict = latestSubmission.verdict;
                vscode.window.showInformationMessage(`${latestSubmission.problem.index}-${latestSubmission.problem.name}: ${verdict}`);
            }
        } catch (error) {
            console.error('Failed to fetch Codeforces submissions:', error);
        }
    }

    const interval = setInterval(checkSubmissions, 500); // Adjust interval as needed

    context.subscriptions.push(vscode.Disposable.from({ dispose: () => clearInterval(interval) }));
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};

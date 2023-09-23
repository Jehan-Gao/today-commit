// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path = require('path');
const moment = require('moment');
import * as vscode from 'vscode';
import { getCommitsForToday } from './utils/git';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "stat-commit" is now active!');

	const today = moment(new Date()).format('YYYY-MM-DD');
	console.log('today ->', today);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('stat-commit.stat', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		
		const repoPath = vscode.workspace.workspaceFile;
		if (!repoPath) {
			return vscode.window.showErrorMessage('repoPath is not found');
		}
		const curProjectName = path.basename(repoPath);
		console.log(curProjectName)
		context.globalState.update(today, null);

		vscode.window.showInformationMessage('开始统计当前项目今日 commit 信息 ！');

		try {
			const commitData = await getCommitsForToday(repoPath as unknown as string)
			console.log('commitData ->', commitData);
			if (!commitData) {
				vscode.window.showInformationMessage(`${curProjectName} 今日没有提交 commit 信息！`);
				return
			}
			const globalData: any = context.globalState.get(today);
			console.log('globalData --->', JSON.stringify(globalData));
			if (!globalData) {
				context.globalState.update(today, { [curProjectName]: commitData });
			} else {
				const originalData = globalData[curProjectName] || {};
				const updateData = { ...originalData, ...commitData };
				context.globalState.update(today, { ...globalData, ...updateData, });
			}
		} catch (error) {
			console.error(error);
		}
	});

	let webview = vscode.commands.registerCommand('stat-commit.commit', async () => {

		 // 创建并显示新的webview
		 const panel = vscode.window.createWebviewPanel(
			'stat-commit', // 只供内部使用，这个webview的标识
			'commit', // 给用户显示的面板标题
			vscode.ViewColumn.One, // 给新的webview面板一个编辑器视图
			{},
		);

		const today = moment(new Date()).format('YYYY-MM-DD');
		const globalData: Record<string, string[]> | null | undefined = context.globalState.get(today);
		console.log(JSON.stringify(globalData))
		// 设置HTML内容
		panel.webview.html = getWebviewContent(today, globalData);
	})

	context.subscriptions.push(disposable, webview);
}

function getWebviewContent(today: string, data: Record<string,string[]> | null | undefined): string {
	if (!data) return ''

	let htmlStr = `<h1>${today}</h2>`
	Object.entries(data).forEach (arr => {
		const [	key, values ] = arr
		htmlStr += `<h2>[项目] ${key}:</h2>`
		for (let key in values) {
			htmlStr += `<h3>[分支] ${key}</h3>`
			const commits = (values[key] as unknown as Array<any>)
			commits.forEach((commit) => {
				htmlStr += `<p>${commit.message} （${commit.author}）</p>`
			})
		}
	})

	return (
		`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>xxx</title>
		</head>
		<body>
			${ htmlStr }
		</body>
		</html>
	`);
  }

// This method is called when your extension is deactivated
export function deactivate() {}

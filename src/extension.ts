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
	console.log('Congratulations, your extension "today-commit" is now active!');

	const today = moment(new Date()).format('YYYY-MM-DD');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('today-commit.stat', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		let repoPath = '';
		if (vscode.workspace.workspaceFolders) {
			repoPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
		}
		if (!repoPath) {
			return vscode.window.showErrorMessage('repoPath missing');
		}

		vscode.window.showInformationMessage('开始统计当前项目今日 commit 信息 ！');

		const curProjectName = path.basename(repoPath);

		try {
			const commitData = await getCommitsForToday(repoPath as unknown as string);
			if (!commitData) {
				vscode.window.showInformationMessage(`${curProjectName} 今日没有提交 commit 信息！`);
				return
			}
			const globalData: any = context.globalState.get(today);
			if (!globalData) {
				context.globalState.update(today, { [curProjectName]: commitData });
			} else {
				const originalData = globalData[curProjectName] || {};
				const updateData = { ...originalData, ...commitData };
				const newData = { ...globalData, [curProjectName]: updateData };
				context.globalState.update(today, newData);
			}
		} catch (error) {
			console.error(error);
		}
	});

	let listPanel: vscode.WebviewPanel | undefined;
	const listWebView = vscode.commands.registerCommand('today-commit.list', async () => {
		if (listPanel) {
			listPanel.reveal(vscode.ViewColumn.One);
		} else {
			// 创建并显示新的webview
			listPanel = vscode.window.createWebviewPanel(
				'today-commit', // 只供内部使用，这个webview的标识
				'today commit list', // 给用户显示的面板标题
				vscode.ViewColumn.One, // 给新的webview面板一个编辑器视图
				{},
			);
		}
		const globalData: Record<string, string[]> | null | undefined = context.globalState.get(today);
		// 设置HTML内容
		const htmlStr = getHtmlStr(today, globalData);
		listPanel.webview.html = getWebviewContent(htmlStr);
	});

	let allListPanel: vscode.WebviewPanel | undefined;
	const allListWebView = vscode.commands.registerCommand('today-commit.all', async () => {
		if (allListPanel) {
			allListPanel.reveal(vscode.ViewColumn.One);
		} else {
			allListPanel = vscode.window.createWebviewPanel(
				'today-commit',
				'all commit list',
				vscode.ViewColumn.One,
				{},
			);
		}
		const keys: readonly string[] = context.globalState.keys();
		let htmlStr = ''
		if (!keys.length) {
			allListPanel.webview.html = htmlStr;
			return
		}
		keys.forEach((key) => {
			const itemData: Record<string, string[]> | null | undefined = context.globalState.get(key);
			htmlStr += getHtmlStr(key, itemData);
		})
		allListPanel.webview.html = getWebviewContent(htmlStr);
	});

	context.subscriptions.push(disposable, listWebView, allListWebView);
}

function getWebviewContent(htmlStr: string): string {
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

function getHtmlStr(title: string, data: Record<string,string[]> | null | undefined): string {
	if (!data) return '';

	let htmlStr = `<h1>${title}</h2>`;
	const space = '&nbsp;&nbsp;&nbsp;&nbsp;'

	Object.entries(data).forEach (arr => {
		const [	projectName, commitInfo ] = arr;
		htmlStr += `<h2>Project: ${projectName}</h2>`;
		if (typeof commitInfo !== 'object') return htmlStr = '';
		for (let branch in commitInfo) {
			htmlStr += `<h3>${space}branch: ${branch}</h3>`;
			const commits = (commitInfo[branch] as unknown as Array<any>);
			if (Array.isArray(commits)) {
				commits.forEach((commit) => {
					htmlStr += `<p>${space}${space} ${commit.message} （${commit.author}）</p>`;
				})
			}
		}
	})
	return htmlStr;
}

// This method is called when your extension is deactivated
export function deactivate() {}

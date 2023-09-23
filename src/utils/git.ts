import git, { CommitObject, ReadCommitResult } from 'isomorphic-git';
const fs = require('fs');
const moment = require('moment');


export const getCommitsForToday = async (repoPath: string | undefined) => {

  const repoExists = fs.existsSync(repoPath);
  if (!repoExists) {
    throw new Error('Repository does not exist!');
  }
  console.log('repoPath -->', repoPath)

  // 获取当天的起始时间和结束时间
  const todayStart = moment().startOf('day');
  const todayEnd = moment().endOf('day');

  // const username = await getUsername(repoPath);
  // console.log('username -->', username);

  const branch = await git.currentBranch({
    fs,
    dir: repoPath,
    fullname: false
  })
  console.log('branch -->', branch)

  const commits = await git.log({
    fs,
    dir: repoPath,
    depth: -1,
    since: moment(todayStart),
  });
  console.log('commits -->', commits)

  const commitsForToday = commits.filter((data: ReadCommitResult) => {
    const { commit } = data;
    const commitDate = moment.unix(commit.committer.timestamp);
    return commitDate.isBetween(todayStart, todayEnd);
  });

  const commitArr = commitsForToday.reduce((arr: Array<Record<string, string>>, commit: ReadCommitResult) => {
    const result = { message: commit.commit.message, author: commit.commit.author.name}
    arr.push(result)
    return arr
  }, [])
  if (!commitArr.length) {
    return null;
  }
  return { [branch as string]: commitArr };
}
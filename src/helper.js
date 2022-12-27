const github = require('@actions/github')

const { deployRefHead, deployRefName, repoInfo, token, target, ref, deployBranchName } = require('./constants')
const octokit = github.getOctokit(token)

const timestamp = new Date().getTime()
const branchName = `${deployRefHead}-${timestamp}`

async function getLastCommit() {
    const { data } = await octokit.rest.repos.getCommit({
        ...repoInfo,
        ref: ref
    })
    console.log(`Getting commit ${data.commit.message}`);
    return data.sha

}

async function createBranch(commitSha) {
    console.log(`Creating branch ${branchName}`)
    await octokit.rest.git.createRef({
        ...repoInfo,
        ref: branchName,
        sha: commitSha
    })

    return branchName
}

async function deleteBranch(branchName) {
    await octokit.rest.git.deleteRef({
        ...repoInfo,
        ref: branchName
    })
    console.log('Deploy branch deleted')
}

async function mergeBranchs(pullHeadRef) {
    return await octokit.rest.repos.merge({
        ...repoInfo,
        base: branchName,
        head: pullHeadRef
    })
}

async function getPrs() {
    const { data } = await octokit.rest.pulls.list({
        ...repoInfo,
        base: target,
    })

    const prs = data.filter(pr => !pr.draft)
    console.log(`Loading ${prs.length} PRs`)
    
    return prs
}

async function updateDeployRef() {
    console.log(`Creating branch ${branchName}`)
    await octokit.rest.git.createRef({
        ...repoInfo,
        ref: branchName,
        sha: commitSha
    })
}

module.exports = {
    updateDeployRef,
    getLastCommit,
    createBranch,
    deleteBranch,
    mergeBranchs,
    getPrs,
}

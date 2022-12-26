const github = require('@actions/github')

const { deployBranchName, deployRefHead, deployRefName, repoInfo, token, target, ref } = require('./constants')
const octokit = github.getOctokit(token)

async function getLastCommit() {
    const { data: sdxLastCommit } = await octokit.rest.repos.getCommit({
        ...repoInfo,
        ref: ref
    })
    return sdxLastCommit
}

async function createBranch(commitSha) {
    const timestamp = new Date().getDate()
    const branchName = `${deployRefHead}-${timestamp}`

    await octokit.rest.git.createRef({
        ...repoInfo,
        ref: branchName,
        sha: commitSha
    })

    console.log('Deploy branch created')
    return branchName
}

async function deleteBranch(branchName) {
    await octokit.rest.git.deleteRef({
        ...repoInfo,
        ref: branchName
    })
    console.log('Deploy branch deleted')
}

async function mergeBranchs(pullHeadRef, deployBranchName) {
    return await octokit.rest.repos.merge({
        ...repoInfo,
        base: deployBranchName,
        head: pullHeadRef,
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

async function updateDeployRef(commitSha) {
    await octokit.rest.git.updateRef({
        ...repoInfo,
        ref: deployRefName,
        sha: commitSha,
        force: true
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

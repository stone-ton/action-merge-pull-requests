const github = require('@actions/github')

const { deployBranchName, deployRefHead, deployRefName, repoInfo, token, ref } = require('./constants')
const octokit = github.getOctokit(token)

async function getLastCommit() {
    const { data: sdxLastCommit } = await octokit.rest.repos.getCommit({
        ...repoInfo,
        ref: ref
    })
    return sdxLastCommit
}

async function createBranch(commitSha) {
    await octokit.rest.git.createRef({
        ...repoInfo,
        ref: deployRefHead,
        sha: commitSha
    })
    console.log('Deploy branch created')
}

async function deleteBranch() {
    await octokit.rest.git.deleteRef({
        ...repoInfo,
        ref: deployRefName
    })
    console.log('Deploy branch deleted')
}

async function mergeBranchs(pullHeadRef) {
    await octokit.rest.repos.merge({
        ...repoInfo,
        base: deployBranchName,
        head: pullHeadRef,
    })
}

async function getPrs() {
    const { data } = await octokit.rest.pulls.list({
        ...repoInfo,
        base: 'sdx'
    })

    const prs = data.filter(pr => !pr.draft)
    console.log(`Loading ${prs.length} PRs`)
    
    return prs
}

module.exports = {
    getLastCommit,
    createBranch,
    deleteBranch,
    mergeBranchs,
    getPrs,
}

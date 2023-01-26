const github = require('@actions/github')

const { deployRefHead, deployRefName, repoInfo, token, target, ref } = require('./constants')
const octokit = github.getOctokit(token)

const timestamp = new Date().getTime()
const auxBranchName = `${deployRefHead}-${timestamp}`
const auxBranchRef = `${deployRefName}-${timestamp}`

async function getLastCommitSha() {
    console.log(`Getting last commit from branch ${ref}`);

    const { data } = await octokit.rest.repos.getCommit({
        ...repoInfo,
        ref: ref
    })

    console.log(`Successful get commit.
    Commit message: ${data.commit.message}`);

    return data.sha
}

async function createAuxBranch(commitSha) {
    console.log(`Creating branch ${auxBranchName}`)
    await createBranch(auxBranchName, commitSha)
    console.log(`Successful create branch`)

    return auxBranchRef
}

async function deleteBranch(branchName) {
    console.log(`Deleting branch ${branchName}`)

    await octokit.rest.git.deleteRef({
        ...repoInfo,
        ref: branchName
    })

    console.log('Successful delete branch')
}

async function mergeBranchs(pullHeadRef) {
    return await octokit.rest.repos.merge({
        ...repoInfo,
        base: auxBranchName,
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

async function recreateDeployBranch(commitSha) {
    console.log(`Recreating branch ${deployRefHead}`)
    await deleteBranch(deployRefName)
    await createBranch(deployRefHead, commitSha)
    console.log(`Successful create branch`)
}

async function createBranch(branchName, commitSha) {
    await octokit.rest.git.createRef({
        ...repoInfo,
        ref: branchName,
        sha: commitSha
    })
}

async function conflictDetails(base, head) {
    const res = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}{?page,per_page}', {
        ...repoInfo,
        basehead: `${base}...${head}`,
        mediaType: {
            format: 'html',
            previews: ['vnd.github.merge-info-preview']
        }
    })
    console.log(res);
}


module.exports = {
    recreateDeployBranch,
    getLastCommitSha,
    conflictDetails,
    createAuxBranch,
    deleteBranch,
    mergeBranchs,
    getPrs,
}

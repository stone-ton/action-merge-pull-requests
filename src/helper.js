const github = require('@actions/github')

const { deployRefHead, deployRefName, repoInfo, token, target, ref, deployBranchName } = require('./constants')
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

    console.log(`Successful get commit with message: ${data.commit.message}`);

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

    let prs = data.filter(pr => !pr.draft)

    const merges = prs.map(async(pr) => {
        const res = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
            ...repoInfo,
            pull_number: pr.number
        })
        
        console.log( {
            pr: pr.number,
            mergeable: res.data.mergeable
        })
    })

    await Promise.all(merges)
    
    const promises = prs.map(async(pr) => {
        const conclusions = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-runs', {
            ...repoInfo,
            ref: pr.head.ref,
        })
        return {
            checks: conclusions.data,
            pr
        }
    })

    const responses = await Promise.all(promises)

    prs = responses.map(res => {
        const hasFailureChecks = res.checks.check_runs.filter(check => {
            return ['action_required', 'failure'].includes(check.conclusion)
        }).length > 0

        if (hasFailureChecks) {
            console.log(`Skiping PR ${res.pr.number} because it has failing checks`);
            return null
        }
        return res.pr
    }).filter( pr => pr)

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

async function conflictDetails(head) {
    const base = `${deployBranchName}-${timestamp}`
    const res = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}{?page,per_page}', {
        ...repoInfo,
        basehead: `${base}...${head}`,
        mediaType: {
            format: 'vnd.github.merge-info-preview'
        }
    })
    const { data: { html_url, permalink_url, diff_url, patch_url } } = res
    console.log(`Para conferir detalhes do conflito veja os links: 
        html_url: ${html_url},
        permalink_url: ${permalink_url},
        diff_url: ${diff_url},
        patch_url: ${patch_url},
    `);
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

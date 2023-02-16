const core = require('@actions/core')
const github = require('@actions/github')

const { deployRefHead, deployRefName, repoInfo, token, target, ref, deployBranchName } = require('./constants')
const octokit = github.getOctokit(token)

const timestamp = new Date().getTime()
const auxBranchName = `${deployRefHead}-${timestamp}`
const auxBranchRef = `${deployRefName}-${timestamp}`

async function getLastCommitSha() {
    core.info(`Getting last commit from branch ${ref}`);

    const { data } = await octokit.rest.repos.getCommit({
        ...repoInfo,
        ref: ref
    })

    core.info(`Successful get commit with message: ${data.commit.message}`);

    return data.sha
}

async function createAuxBranch(commitSha) {
    core.info(`Creating branch ${auxBranchName}`)
    await createBranch(auxBranchName, commitSha)
    core.info(`Successful create branch`)

    return auxBranchRef
}

async function deleteBranch(branchName) {
    core.info(`Deleting branch ${branchName}`)

    try {
        await octokit.rest.git.deleteRef({
            ...repoInfo,
            ref: branchName,
        })   
        core.info('Successful delete branch')
    } catch (error) {
        if (error.message !== 'Reference does not exist') {
            throw Error('Unexpected error on delete branch')
        }
        core.warning('Branch does not exists');
    }
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

    // Filtering draft PRs
    let prs = data.filter(pr => !pr.draft)

    // Filtering PRs with merge conflicts with base or pending required reviews
    const mergeableStatuses = prs.map(async(pr) => {
        const res = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
            ...repoInfo,
            pull_number: pr.number
        })
        
        return {
            pr,
            mergeable: res.data.mergeable
        }
    })

    const mergeable = await Promise.all(mergeableStatuses)

    prs = mergeable.map(ms => {
        if (ms.mergeable) {
            return ms.pr
        }
        core.info(`Skiping PR ${ms.pr.number} because it's not mergeable`);
        return null
    }). filter(pr => pr)
    
    // Filtering PRs with failed checks
    const checksStatuses = prs.map(async(pr) => {
        const conclusions = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-runs', {
            ...repoInfo,
            ref: pr.head.ref,
        })
        return {
            checks: conclusions.data,
            pr
        }
    })

    const checksResponses = await Promise.all(checksStatuses)

    prs = checksResponses.map(res => {
        const hasFailureChecks = res.checks.check_runs.filter(check => {
            /**
             * For the releted PR, the action status will be (null) at this point because it's in progress.
             * It prevents from skip current pr if last check run from this action had report failure status.
             */
            return ['action_required', 'cancelled', 'timed_out', 'failure'].includes(check.conclusion)
        }).length > 0

        if (hasFailureChecks) {
            core.info(`Skiping PR ${res.pr.number} because it has failing checks`);
            return null
        }
        return res.pr
    }).filter(pr => pr)

    core.info(`Loading ${prs.length} PRs`)
    return prs
}

async function recreateDeployBranch(commitSha) {
    core.info(`Recreating branch ${deployRefHead}`)
    await deleteBranch(deployRefName)
    await createBranch(deployRefHead, commitSha)
    core.info(`Successful create branch`)
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
    core.setFailed(`Para conferir detalhes do conflito veja os links: 
        html_url: ${html_url},
        permalink_url: ${permalink_url},
        diff_url: ${diff_url},
        patch_url: ${patch_url},
    `)
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

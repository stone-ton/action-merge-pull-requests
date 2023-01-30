const core = require('@actions/core')
const { getLastCommitSha, createAuxBranch, deleteBranch, getPrs, mergeBranchs, recreateDeployBranch, conflictDetails } = require('./helper')

async function run() {
    const baseLastCommit = await getLastCommitSha()

    const workBranchName = await createAuxBranch(baseLastCommit)

    const pullRequests = await getPrs()

    let lastBranchToMerge
    try {
        let lastMergeCommitSha
        for (let pull of pullRequests) {
            core.info(`Merging PR ${pull.number}`)
            lastBranchToMerge = pull.head.ref

            const { data } = await mergeBranchs(pull.head.ref)

            core.info(`Successful merge PR ${pull.number}`);
            
            lastMergeCommitSha = data.sha
        }
        await recreateDeployBranch(lastMergeCommitSha)
    } catch(error) {
        await conflictDetails(lastBranchToMerge)
    } finally {
        await deleteBranch(workBranchName)
    }
}

run()

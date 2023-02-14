const { getLastCommitSha, createAuxBranch, deleteBranch, getPrs, mergeBranchs, recreateDeployBranch, conflictDetails } = require('./helper')

async function run() {
    const baseLastCommit = await getLastCommitSha()

    const workBranchName = await createAuxBranch(baseLastCommit)

    const pullRequests = await getPrs()

    let lastBranchToMerge
    let mergeError
    try {
        let lastMergeCommitSha
        for (let pull of pullRequests) {
            console.log(`Merging PR ${pull.number}`)
            lastBranchToMerge = pull.head.ref

            const { data } = await mergeBranchs(pull.head.ref)

            console.log(`Successful merge PR ${pull.number}`);
            
            lastMergeCommitSha = data.sha
        }
        await recreateDeployBranch(lastMergeCommitSha)
    } catch(error) {
        mergeError = error
        await conflictDetails(lastBranchToMerge)
    } finally {
        await deleteBranch(workBranchName)
    }

    if (mergeError) {
        throw mergeError
    }
}

run()

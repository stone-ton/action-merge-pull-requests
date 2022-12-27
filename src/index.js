const { getLastCommit, createBranch, deleteBranch, getPrs, mergeBranchs, updateDeployRef } = require('./helper')

async function run() {
    const baseLastCommit = await getLastCommit()

    const workBranchName = await createBranch(baseLastCommit)

    const pullRequests = await getPrs()


    let lastMergeCommitSha
    for (let pull of pullRequests) {
        try {
            console.log(`Merging PR ${pull.number}`);
            const { data } = await mergeBranchs(pull.head.ref)
            lastMergeCommitSha = data.sha
        } catch (error) {
            console.error(error.response.data.message)
            await deleteBranch(workBranchName)
            throw new Error('Merge conflict')
        }
    }

    await updateDeployRef(lastMergeCommitSha)

    await deleteBranch(workBranchName)
}

run()

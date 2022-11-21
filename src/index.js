const { getLastCommit, createBranch, deleteBranch, getPrs, mergeBranchs } = require('./helper')

async function run() {
    const sdxLastCommit = await getLastCommit()

    try {        
        await createBranch(sdxLastCommit.sha)
    } catch (error) {
        await deleteBranch()
        await createBranch(sdxLastCommit.sha)
    }

    const pullRequests = await getPrs()

    // Check if all prs can be merged together in SDX based branch
    for (let pull of pullRequests) {
        try {
            await mergeBranchs(pull.head.ref)
        } catch (error) {
            console.error(error.response.data.message)
            throw new Error('Merge conflict')
        }
    }
    console.log('Merge Success!');
}

run()

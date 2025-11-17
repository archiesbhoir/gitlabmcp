/**
 * Basic usage example for GitLab MCP
 */
import { healthCheck, getMergeRequestView } from '../src/index.js';

async function main() {
  try {
    // 1. Health check
    console.log('Checking GitLab connectivity...');
    const health = await healthCheck();
    console.log('Health check:', health);

    if (!health.reachable) {
      console.error('GitLab is not reachable:', health.error);
      process.exit(1);
    }

    // 2. Fetch a merge request
    const fullPath = 'group/project'; // Replace with your project path
    const iid = '123'; // Replace with your MR IID

    console.log(`\nFetching MR !${iid} from ${fullPath}...`);
    const mrView = await getMergeRequestView(fullPath, iid, {
      commitsFirst: 50,
      discussionsFirst: 50,
      forceRefresh: false,
    });

    console.log('\nMerge Request:');
    console.log(`  Title: ${mrView.title}`);
    console.log(`  State: ${mrView.state}`);
    console.log(`  Author: ${mrView.author.name} (@${mrView.author.username})`);
    console.log(`  Commits: ${mrView.commits.length}`);
    console.log(`  Pipelines: ${mrView.pipelines.length}`);
    console.log(`  Diffs: ${mrView.diffs.length}`);
    console.log(`  Discussions: ${mrView.discussions.length}`);
    console.log(`  Approvals: ${mrView.approvals.approved ? 'Approved' : 'Pending'}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}


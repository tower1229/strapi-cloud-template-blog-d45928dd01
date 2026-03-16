
module.exports = {
  async afterUpdate(event) {
    const { result } = event;

    // 只有当文章已发布（publishedAt 不为空）时才触发构建
    // 这样可以覆盖：点击发布、已发布文章的修改保存
    if (result.publishedAt) {
      console.log('🚀 Detected article change, triggering GitHub Actions...');
      triggerGitHubBuild('article_update', result);
    }
  },

  async afterDelete(event) {
    const { result } = event;
    console.log('🚀 Article deleted, triggering GitHub Actions...');
    triggerGitHubBuild('article_delete', result);
  }
};

async function triggerGitHubBuild(actionType, data) {
  const GITHUB_PAT = process.env.GH_PAT; // 复用项目中的 GH_PAT
  const REPO_OWNER = 'zCloak-Network';
  const REPO_NAME = 'zcloak-ai-official';

  if (!GITHUB_PAT) {
    console.error('❌ GH_PAT is not defined in environment variables.');
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'User-Agent': 'Strapi-CMS',
      },
      body: JSON.stringify({
        event_type: 'strapi_publish', // 对应 deploy-strapi.yml 中的 types
        client_payload: {
          action: actionType,
          slug: data.slug,
          title: data.title
        }
      }),
    });

    if (response.ok) {
      console.log('✅ GitHub Actions successfully triggered!');
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to trigger GitHub Actions:', errorData);
    }
  } catch (err) {
    console.error('❌ Network error while triggering GitHub:', err);
  }
}

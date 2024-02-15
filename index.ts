import '@logseq/libs'
import { LSPluginBaseInfo } from '@logseq/libs/dist/libs'

const delay = (t = 100) => new Promise(r => setTimeout(r, t))

async function loadGitlabData () {
  const endpoint = 'https://git.example.com/api/v4/issues?scope=all&assignee_username=ShurumBurum&private_token=glpat-oa_Dj1N53rAwA8PhYAbxr'

  const response = await fetch(endpoint)
  const issues = await response.json()

  return issues.map( i => {

    return `${i.id}. [${i.title}](${i.web_url}) [:small.opacity-50 "🔥 ${i.state}"]
collapsed:: true    
> ${i.description}`
  })
}

/**
 * main entry
 * @param baseInfo
 */
function main (baseInfo: LSPluginBaseInfo) {
  let loading = false

  logseq.provideModel({
    async loadIssues () {

      const info = await logseq.App.getUserConfigs()
      if (loading) return

      const pageName = 'Gitlab Issues'
      const blockTitle = (new Date()).toLocaleString()

      logseq.App.pushState('page', { name: pageName })

      await delay(300)

      loading = true

      try {
        const currentPage = await logseq.Editor.getCurrentPage()
        if (currentPage?.originalName !== pageName) throw new Error('page error')

        const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()
        let targetBlock = pageBlocksTree[0]!

        targetBlock = await logseq.Editor.insertBlock(targetBlock.uuid, '🚀 Fetching issues from Gitlab ...', { before: true })

        let blocks = await loadGitlabData()

        blocks = blocks.map(it => ({ content: it }))

        await logseq.Editor.insertBatchBlock(targetBlock.uuid, blocks, {
          sibling: false
        })

        await logseq.Editor.updateBlock(targetBlock.uuid, `## 🔖 Gitlab Issues - ${blockTitle}`)
      } catch (e) {
        logseq.App.showMsg(e.toString(), 'warning')
        console.error(e)
      } finally {
        loading = false
      }
    }
  })

  logseq.App.registerUIItem('toolbar', {
    key: 'logseq-gitlab-issues',
    template: `
      <a data-on-click="loadIssues"
         class="button">
        <i class="ti ti-brand-gitlab"></i>
      </a>
    `
  })

  logseq.provideStyle(`
    [data-injected-ui=logseq-gitlab-issues-${baseInfo.id}] {
      display: flex;
      align-items: center;
    }
  `)
}

// bootstrap
logseq.ready(main).catch(console.error)

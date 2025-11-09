/**
 * Security Test Report Generator
 *
 * Generates HTML and JSON reports from test results
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REPORTS_DIR = path.join(__dirname, '../reports')
const RESULTS_FILE = path.join(REPORTS_DIR, 'test-results.json')

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
}

function generateHTMLReport(results) {
  const timestamp = new Date().toISOString()
  const totalTests = results.numTotalTests || 0
  const passedTests = results.numPassedTests || 0
  const failedTests = results.numFailedTests || 0
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
        }
        h1 { font-size: 28px; margin-bottom: 10px; }
        .timestamp { opacity: 0.9; font-size: 14px; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        .metric {
            text-align: center;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        .metric-value {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .pass { color: #10b981; }
        .fail { color: #ef4444; }
        .warn { color: #f59e0b; }
        .tests {
            padding: 30px;
        }
        .test-suite {
            margin-bottom: 30px;
            border: 1px solid #eee;
            border-radius: 8px;
            overflow: hidden;
        }
        .suite-header {
            background: #f9f9f9;
            padding: 15px 20px;
            font-weight: 600;
            font-size: 18px;
            border-bottom: 1px solid #eee;
        }
        .test-case {
            padding: 12px 20px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .test-case:last-child {
            border-bottom: none;
        }
        .test-status {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .test-status.pass {
            background: #10b981;
        }
        .test-status.fail {
            background: #ef4444;
        }
        .test-name {
            flex: 1;
            font-size: 14px;
        }
        .test-duration {
            color: #666;
            font-size: 12px;
        }
        .footer {
            padding: 20px 30px;
            background: #f9f9f9;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #eee;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔒 Security Test Report</h1>
            <div class="timestamp">Generated: ${timestamp}</div>
        </header>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${failedTests === 0 ? 'pass' : 'fail'}">${totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value pass">${passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value fail">${failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value ${passRate >= 80 ? 'pass' : passRate >= 60 ? 'warn' : 'fail'}">${passRate}%</div>
                <div class="metric-label">Pass Rate</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${passRate}%"></div>
                </div>
            </div>
        </div>

        <div class="tests">
            ${generateTestSuitesHTML(results.testResults || [])}
        </div>

        <div class="footer">
            Interviewer Roster Security Test Suite v1.0.0
        </div>
    </div>
</body>
</html>
  `

  return html
}

function generateTestSuitesHTML(testResults) {
  if (!testResults || testResults.length === 0) {
    return '<p style="text-align: center; color: #666;">No test results available</p>'
  }

  return testResults.map(suite => {
    const suiteName = path.basename(suite.name, '.test.js')
    const tests = suite.assertionResults || []

    return `
      <div class="test-suite">
        <div class="suite-header">${suiteName}</div>
        ${tests.map(test => `
          <div class="test-case">
            <div class="test-status ${test.status}"></div>
            <div class="test-name">${test.title}</div>
            <div class="test-duration">${test.duration || 0}ms</div>
          </div>
        `).join('')}
      </div>
    `
  }).join('')
}

function generateMarkdownSummary(results) {
  const timestamp = new Date().toISOString()
  const totalTests = results.numTotalTests || 0
  const passedTests = results.numPassedTests || 0
  const failedTests = results.numFailedTests || 0
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0

  let markdown = `# 🔒 Security Test Report\n\n`
  markdown += `**Generated:** ${timestamp}\n\n`
  markdown += `## Summary\n\n`
  markdown += `| Metric | Value |\n`
  markdown += `|--------|-------|\n`
  markdown += `| Total Tests | ${totalTests} |\n`
  markdown += `| Passed | ✅ ${passedTests} |\n`
  markdown += `| Failed | ❌ ${failedTests} |\n`
  markdown += `| Pass Rate | ${passRate}% |\n\n`

  if (failedTests > 0) {
    markdown += `## ⚠️ Failed Tests\n\n`
    const testResults = results.testResults || []
    testResults.forEach(suite => {
      const failed = (suite.assertionResults || []).filter(t => t.status === 'failed')
      if (failed.length > 0) {
        markdown += `### ${path.basename(suite.name, '.test.js')}\n\n`
        failed.forEach(test => {
          markdown += `- ❌ ${test.title}\n`
          if (test.failureMessages && test.failureMessages.length > 0) {
            markdown += `  \`\`\`\n  ${test.failureMessages[0]}\n  \`\`\`\n\n`
          }
        })
      }
    })
  }

  markdown += `## Test Suites\n\n`
  const testResults = results.testResults || []
  testResults.forEach(suite => {
    const suiteName = path.basename(suite.name, '.test.js')
    const tests = suite.assertionResults || []
    const suitePassed = tests.filter(t => t.status === 'passed').length
    const suiteFailed = tests.filter(t => t.status === 'failed').length

    markdown += `### ${suiteName}\n\n`
    markdown += `- ✅ Passed: ${suitePassed}\n`
    markdown += `- ❌ Failed: ${suiteFailed}\n`
    markdown += `- Total: ${tests.length}\n\n`
  })

  return markdown
}

// Main execution
try {
  console.log('📊 Generating security test report...\n')

  // Check if results file exists
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error('❌ No test results found. Run tests first with: npm run test:ci')
    process.exit(1)
  }

  // Read test results
  const resultsJSON = fs.readFileSync(RESULTS_FILE, 'utf8')
  const results = JSON.parse(resultsJSON)

  // Generate HTML report
  const htmlReport = generateHTMLReport(results)
  const htmlPath = path.join(REPORTS_DIR, 'security-report.html')
  fs.writeFileSync(htmlPath, htmlReport)
  console.log(`✅ HTML report generated: ${htmlPath}`)

  // Generate Markdown summary
  const markdownSummary = generateMarkdownSummary(results)
  const mdPath = path.join(REPORTS_DIR, 'security-summary.md')
  fs.writeFileSync(mdPath, markdownSummary)
  console.log(`✅ Markdown summary generated: ${mdPath}`)

  // Print summary to console
  console.log('\n' + markdownSummary)

  // Exit with appropriate code
  const failedTests = results.numFailedTests || 0
  if (failedTests > 0) {
    console.error(`\n❌ ${failedTests} security test(s) failed`)
    process.exit(1)
  } else {
    console.log('\n✅ All security tests passed')
    process.exit(0)
  }
} catch (error) {
  console.error('❌ Error generating report:', error.message)
  process.exit(1)
}

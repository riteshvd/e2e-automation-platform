pipeline {
  agent any

  environment {
    BASE_URL = "http://localhost:3001"
    CI = "true"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        bat '''
          cd aut
          if not exist node_modules npm install

          cd ..\\ui-tests
          if not exist node_modules npm install

          cd ..\\api-tests
          if not exist node_modules npm install

          cd ..
          if not exist reports mkdir reports
          if not exist artifacts mkdir artifacts
        '''
        bat '''
          cd ui-tests
          npx playwright install
        '''
      }
    }

    stage('Start AUT') {
      steps {
        bat '''
          cd aut
          powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath node -ArgumentList 'server.js' -WindowStyle Hidden -RedirectStandardOutput '..\\artifacts\\aut.log' -RedirectStandardError '..\\artifacts\\aut.err.log'"
        '''
        bat '''
          powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $url='http://localhost:3001/health'; for($i=1; $i -le 30; $i++){ try { $resp=Invoke-RestMethod -Uri $url -TimeoutSec 2; if($resp.ok -eq $true){ Write-Host 'AUT is healthy'; exit 0 } } catch { Write-Host ('Waiting for AUT... attempt ' + $i); Start-Sleep -Seconds 1 } } Write-Error 'AUT did not become healthy in time'; exit 1"
        '''
      }
    }

    stage('Run Tests (Parallel)') {
      parallel {
        stage('API Tests') {
          steps {
            bat '''
              npx newman run api-tests\\collections\\todo-api.postman_collection.json ^
                -e api-tests\\env\\local.postman_environment.json ^
                -r cli,junit,htmlextra ^
                --reporter-junit-export reports\\api-junit.xml ^
                --reporter-htmlextra-export reports\\api-html.html
            '''
          }
        }

        stage('UI Tests') {
          steps {
            bat '''
              cd ui-tests
              set BASE_URL=http://localhost:3001
              set CI=true

              REM Produce CI-friendly reports into /reports
              npx playwright test --reporter=line,html,junit

              REM Copy Playwright HTML report into repo-level reports folder for Jenkins publishing
              if exist playwright-report (
                if not exist ..\\reports\\ui-html mkdir ..\\reports\\ui-html
                xcopy /E /I /Y playwright-report ..\\reports\\ui-html
              )

              REM Copy JUnit XML into repo-level reports folder
              if exist test-results\\junit.xml (
                copy /Y test-results\\junit.xml ..\\reports\\ui-junit.xml
              )
            '''
          }
        }
      }
    }

    stage('Flaky Analysis') {
      steps {
        bat '''
          REM Run flaky analyzer (creates reports/flaky-summary.json)
          node tools\\flaky-analyzer.js
        '''
        script {
          // Optional: Mark build UNSTABLE if flaky detected (but don't fail)
          if (fileExists('reports/flaky-summary.json')) {
            def flakyJson = readFile('reports/flaky-summary.json')
            if (flakyJson.contains('"flakyDetected": true')) {
              currentBuild.result = 'UNSTABLE'
              echo "Marked UNSTABLE due to flaky signal (retry/noise detected)."
            }
          }
        }
      }
    }

    stage('Publish Reports') {
      steps {
        junit allowEmptyResults: true, testResults: 'reports/*.xml'

        publishHTML(target: [
          allowMissing: true,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'reports/ui-html',
          reportFiles: 'index.html',
          reportName: 'Playwright UI Report'
        ])

        publishHTML(target: [
          allowMissing: true,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'reports',
          reportFiles: 'api-html.html',
          reportName: 'Newman API Report'
        ])

        publishHTML(target: [
          allowMissing: true,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'reports',
          reportFiles: 'flaky-summary.json',
          reportName: 'Flaky Summary (JSON)'
        ])

        archiveArtifacts artifacts: 'reports/**, artifacts/**', allowEmptyArchive: true
      }
    }
  }

post {
  always {
    bat '''
      powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $c = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('Stopped PID ' + $c.OwningProcess + ' on port 3001'); } else { Write-Host 'No process found on port 3001'; }"
    '''
  }
}

}

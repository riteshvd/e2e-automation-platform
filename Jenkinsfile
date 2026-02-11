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

          cd ..
          if not exist node_modules npm install
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
  	if not exist artifacts mkdir artifacts
  	cd aut
  	powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    	"Start-Process node -ArgumentList 'server.js' -WindowStyle Hidden -	RedirectStandardOutput ..\\artifacts\\aut.log -RedirectStandardError ..\\artifacts	\\aut.err.log"
	'''

        bat '''
  	powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    	"$ErrorActionPreference='Stop'; ^
     	$url='http://localhost:3001/health'; ^
     	for($i=1; $i -le 20; $i++){ ^
       	try { ^
         $resp = Invoke-RestMethod -Uri $url -TimeoutSec 2; ^
         if($resp.ok -eq $true){ Write-Host 'AUT is healthy'; exit 0 } ^
       	} catch { ^
         Write-Host ('Waiting for AUT... attempt ' + $i); ^
         Start-Sleep -Seconds 1; ^
       	} ^
     	} ^
     	Write-Error 'AUT did not become healthy in time'; exit 1"
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
              npx playwright test
            '''
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
      }
    }
  }

  post {
    always {
      bat '''
        powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
      '''
    }
  }
}

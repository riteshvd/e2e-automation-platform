pipeline {
  agent any

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Docker Images') {
      steps {
        bat 'docker compose build --no-cache'
      }
    }

    stage('Start AUT Container') {
      steps {
        bat 'docker compose up -d aut'
      }
    }

    stage('Run API Tests') {
      steps {
        bat 'docker compose run --rm api-tests'
      }
    }

    stage('Run UI Tests') {
      steps {
        bat 'docker compose run --rm ui-tests'
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
      bat 'docker compose down -v'
    }
  }
}

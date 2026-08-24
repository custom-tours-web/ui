BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force
}

Describe 'Invoke-WebAssetsValidation Unit Tests' {

    BeforeEach {
        # Mock Write-Log globally within the module to keep the test console clean
        Mock Write-Log {} -ModuleName 'WebAssetBuilder'
        
        # Define our fake project paths inside Pester's automatic TestDrive
        $fakeProject = Join-Path $TestDrive "FakeProject"
        $fakeDist = Join-Path $fakeProject "dist"
    }

    AfterEach {
        # Wipe the TestDrive clean between EVERY 'It' block to prevent file leakage
        Get-ChildItem -Path $TestDrive -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: Find-ProjectRoot Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if the project root cannot be determined' {
        Mock Find-ProjectRoot { return $null } -ModuleName 'WebAssetBuilder'

        { Invoke-WebAssetsValidation -StartPath $TestDrive } | 
            Should-Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Dist Directory is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the dist directory does not exist' {
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        
        # We DO NOT create the 'dist' directory here, so Test-Path naturally fails
        { Invoke-WebAssetsValidation -StartPath $TestDrive } | 
            Should-Throw "Final dist directory was not created: $fakeDist"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Missing Specific File Types
    # ----------------------------------------------------------------------
    Context 'When the dist directory exists but lacks specific files' {
        
        BeforeEach {
            Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
            
            # Physically create the dist directory in the TestDrive
            New-Item -ItemType Directory -Path $fakeDist -Force | Out-Null
        }

        It 'Should throw an error if no HTML files are found' {
            # Create CSS and JS, but skip HTML
            New-Item -ItemType File -Path (Join-Path $fakeDist "style.css") -Force | Out-Null
            New-Item -ItemType File -Path (Join-Path $fakeDist "app.js") -Force | Out-Null

            { Invoke-WebAssetsValidation -StartPath $TestDrive } | 
                Should-Throw 'No HTML files found in final dist.'
        }

        It 'Should throw an error if no CSS files are found' {
            # Create HTML and JS, but skip CSS
            New-Item -ItemType File -Path (Join-Path $fakeDist "index.html") -Force | Out-Null
            New-Item -ItemType File -Path (Join-Path $fakeDist "app.js") -Force | Out-Null

            { Invoke-WebAssetsValidation -StartPath $TestDrive } | 
                Should-Throw 'No CSS files found in final dist.'
        }

        It 'Should throw an error if no JS files are found' {
            # Create HTML and CSS, but skip JS
            New-Item -ItemType File -Path (Join-Path $fakeDist "index.html") -Force | Out-Null
            New-Item -ItemType File -Path (Join-Path $fakeDist "style.css") -Force | Out-Null

            { Invoke-WebAssetsValidation -StartPath $TestDrive } | 
                Should-Throw 'No JavaScript files found in final dist.'
        }
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: The Happy Path
    # ----------------------------------------------------------------------
    It 'Should execute successfully without throwing when all files are present' {
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        
        # Physically create the dist directory and ALL required files
        New-Item -ItemType Directory -Path $fakeDist -Force | Out-Null
        New-Item -ItemType File -Path (Join-Path $fakeDist "index.html") -Force | Out-Null
        New-Item -ItemType File -Path (Join-Path $fakeDist "style.css") -Force | Out-Null
        New-Item -ItemType File -Path (Join-Path $fakeDist "app.js") -Force | Out-Null

        # The function should complete without throwing any exceptions
        Invoke-WebAssetsValidation -StartPath $TestDrive
    }
}
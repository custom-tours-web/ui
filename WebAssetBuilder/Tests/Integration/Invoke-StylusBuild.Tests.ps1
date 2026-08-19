BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force
}

Describe 'Invoke-StylusBuild Integration Tests' {
    
    BeforeEach {
        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "WAB_IT_$(New-Guid)"
        New-Item -ItemType Directory -Path $script:tempRoot -Force | Out-Null

        $script:srcDir = Join-Path $script:tempRoot "src"
        New-Item -ItemType Directory -Path $script:srcDir -Force | Out-Null
    }

    AfterEach {
        if (Test-Path $script:tempRoot) {
            Remove-Item -Path $script:tempRoot -Recurse -Force
        }
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: stylus CLI is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error when the Stylus CLI is not found' {
        # Simulates the condition where the CLI is missing from the environment[cite: 12].
        Mock Get-Command { return $null } -ParameterFilter { $Name -eq 'stylus' }

        { Invoke-StylusBuild -StartPath $script:tempRoot } | 
            Should -Throw "Stylus CLI not found. Install via 'npm install -g stylus'."
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Invalid Project Root
    # ----------------------------------------------------------------------
    It 'Should throw an error when the project root cannot be determined' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'stylus' }
        
        # Forces the project root lookup to fail[cite: 12].
        Mock Find-ProjectRoot { return $null }

        { Invoke-StylusBuild -StartPath $script:tempRoot } | 
            Should -Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Missing Source Directory
    # ----------------------------------------------------------------------
    It 'Should throw an error when the Stylus source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'stylus' }
        
        # The target source directory 'src/styl' is deliberately not created[cite: 12].
        { Invoke-StylusBuild -StartPath $script:tempRoot } | 
            Should -Throw "Stylus source directory not found:*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: No Stylus Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error when the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'stylus' }

        $stylSrcDir = Join-Path $script:tempRoot "src/styl"
        New-Item -ItemType Directory -Path $stylSrcDir -Force | Out-Null

        # Verifies the script throws when no .styl files are present to compile[cite: 12].
        { Invoke-StylusBuild -StartPath $script:tempRoot } | 
            Should -Throw "No Stylus files found in:*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 5: Compilation Failure (stylus returns non-zero exit code)
    # ----------------------------------------------------------------------
    It 'Should throw an error when stylus compilation fails' -Skip:(-not (Get-Command 'stylus' -ErrorAction SilentlyContinue)) {
        $stylSrcDir = Join-Path $script:tempRoot "src/styl"
        New-Item -ItemType Directory -Path $stylSrcDir -Force | Out-Null

        # Injects invalid syntax to trigger a non-zero exit code from the stylus CLI[cite: 12].
        $badStylFile = Join-Path $stylSrcDir "bad.styl"
        Set-Content -Path $badStylFile -Value "]]] INVALID STYLUS SYNTAX {{{"

        { Invoke-StylusBuild -StartPath $script:tempRoot } | 
            Should -Throw "Stylus compilation failed for*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 6: The Happy Path (Successful Compilation)
    # ----------------------------------------------------------------------
    It 'Should compile Stylus files to CSS successfully' -Skip:(-not (Get-Command 'stylus' -ErrorAction SilentlyContinue)) {
        $stylSrcDir = Join-Path $script:tempRoot "src/styl"
        New-Item -ItemType Directory -Path $stylSrcDir -Force | Out-Null

        $validStylFile = Join-Path $stylSrcDir "app.styl"
        Set-Content -Path $validStylFile -Value "body`n  color red"

        { Invoke-StylusBuild -StartPath $script:tempRoot } | Should -Not -Throw

        # Verifies that the default 'dist/css' output folder is created properly[cite: 12].
        $cssDistDir = Join-Path $script:tempRoot "dist/css"
        Test-Path $cssDistDir -PathType Container | Should -BeTrue

        $compiledCssFile = Join-Path $cssDistDir "app.css"
        Test-Path $compiledCssFile -PathType Leaf | Should -BeTrue
    }
}
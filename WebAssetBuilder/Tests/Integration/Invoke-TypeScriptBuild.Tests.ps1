BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force
}

Describe 'Invoke-TypeScriptBuild Integration Tests' {
    
    BeforeEach {
        # Create a unique temporary "Project Root" directory for every test
        $script:tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "WAB_IT_$(New-Guid)"
        New-Item -ItemType Directory -Path $script:tempRoot -Force | Out-Null

        # Create the 'src' folder so 'Find-ProjectRoot' successfully identifies this as a valid project
        $script:srcDir = Join-Path $script:tempRoot "src"
        New-Item -ItemType Directory -Path $script:srcDir -Force | Out-Null
    }

    AfterEach {
        # Clean up the temporary project root after each test completes
        if (Test-Path $script:tempRoot) {
            Remove-Item -Path $script:tempRoot -Recurse -Force
        }
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: tsc CLI is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error when the TypeScript CLI (tsc) is not found' {
        # Mock Get-Command to simulate 'tsc' missing from the system environment
        Mock Get-Command { return $null } -ParameterFilter { $Name -eq 'tsc' }

        { Invoke-TypeScriptBuild -StartPath $script:tempRoot } | 
            Should -Throw "TypeScript CLI (tsc) not found. Install via 'npm install -g typescript'."
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Invalid Project Root
    # ----------------------------------------------------------------------
    It 'Should throw an error when the project root cannot be determined' {
        # Ensure tsc check passes so it reaches the Find-ProjectRoot logic
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'tsc' }
        
        # Force Find-ProjectRoot to fail
        Mock Find-ProjectRoot { return $null }

        { Invoke-TypeScriptBuild -StartPath $script:tempRoot } | 
            Should -Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Missing Source Directory
    # ----------------------------------------------------------------------
    It 'Should throw an error when the TypeScript source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'tsc' }
        
        # The default source directory 'src/ts' is intentionally NOT created here
        $expectedMissingDir = Join-Path $script:tempRoot "src\ts"

        { Invoke-TypeScriptBuild -StartPath $script:tempRoot } | 
            Should -Throw "TypeScript source directory not found:*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: No TypeScript Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error when the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'tsc' }

        # Create the source directory, but add zero .ts files to it
        $tsSrcDir = Join-Path $script:tempRoot "src/ts"
        New-Item -ItemType Directory -Path $tsSrcDir -Force | Out-Null

        { Invoke-TypeScriptBuild -StartPath $script:tempRoot } | 
            Should -Throw "No TypeScript files found in:*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 5: Compilation Failure (tsc returns non-zero exit code)
    # ----------------------------------------------------------------------
    It 'Should throw an error when tsc compilation fails' -Skip:(-not (Get-Command 'tsc' -ErrorAction SilentlyContinue)) {
        # Create the source directory
        $tsSrcDir = Join-Path $script:tempRoot "src/ts"
        New-Item -ItemType Directory -Path $tsSrcDir -Force | Out-Null

        # Create a TypeScript file with deliberately invalid, uncompilable syntax
        $badTsFile = Join-Path $tsSrcDir "bad.ts"
        Set-Content -Path $badTsFile -Value "]]] INVALID TYPESCRIPT SYNTAX {{{"

        { Invoke-TypeScriptBuild -StartPath $script:tempRoot } | 
            Should -Throw "TypeScript compilation failed for*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 6: The Happy Path (Successful Compilation)
    # ----------------------------------------------------------------------
    It 'Should compile TypeScript files to JavaScript successfully' -Skip:(-not (Get-Command 'tsc' -ErrorAction SilentlyContinue)) {
        # Create the source directory
        $tsSrcDir = Join-Path $script:tempRoot "src/ts"
        New-Item -ItemType Directory -Path $tsSrcDir -Force | Out-Null

        # Create a valid TypeScript file
        $validTsFile = Join-Path $tsSrcDir "app.ts"
        Set-Content -Path $validTsFile -Value "const greeting: string = 'Hello World';"

        # Execute the function; it should not throw any exceptions
        { Invoke-TypeScriptBuild -StartPath $script:tempRoot } | Should -Not -Throw

        # Assert that the dist/js directory was created
        $jsDistDir = Join-Path $script:tempRoot "dist/js"
        Test-Path $jsDistDir -PathType Container | Should -BeTrue

        # Assert that the compiled JavaScript file exists
        $compiledJsFile = Join-Path $jsDistDir "app.js"
        Test-Path $compiledJsFile -PathType Leaf | Should -BeTrue
    }
}
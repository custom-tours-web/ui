BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force
}

Describe 'Invoke-HamlBuild Integration Tests' {
    
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
    # SCENARIO 1: haml CLI is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error when the HAML CLI is not found' {
        # Simulates the condition where the CLI is missing from the environment[cite: 13].
        Mock Get-Command { return $null } -ParameterFilter { $Name -eq 'haml' }

        { Invoke-HamlBuild -StartPath $script:tempRoot } | 
            Should -Throw "HAML CLI not found. Install via 'gem install haml'."
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Invalid Project Root
    # ----------------------------------------------------------------------
    It 'Should throw an error when the project root cannot be determined' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'haml' }
        
        # Forces the project root lookup to fail[cite: 13].
        Mock Find-ProjectRoot { return $null }

        { Invoke-HamlBuild -StartPath $script:tempRoot } | 
            Should -Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Missing Source Directory
    # ----------------------------------------------------------------------
    It 'Should throw an error when the HAML source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'haml' }
        
        # The target source directory 'src/haml' is deliberately not created[cite: 13].
        { Invoke-HamlBuild -StartPath $script:tempRoot } | 
            Should -Throw "HAML source directory not found:*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: No HAML Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error when the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq 'haml' }

        $hamlSrcDir = Join-Path $script:tempRoot "src/haml"
        New-Item -ItemType Directory -Path $hamlSrcDir -Force | Out-Null

        # Verifies the script throws when no .haml files are present to compile[cite: 13].
        { Invoke-HamlBuild -StartPath $script:tempRoot } | 
            Should -Throw "No HAML files found in:*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 5: Compilation Failure (haml returns non-zero exit code)
    # ----------------------------------------------------------------------
    It 'Should throw an error when haml compilation fails' -Skip:(-not (Get-Command 'haml' -ErrorAction SilentlyContinue)) {
        $hamlSrcDir = Join-Path $script:tempRoot "src/haml"
        New-Item -ItemType Directory -Path $hamlSrcDir -Force | Out-Null

        # Injects invalid syntax to trigger a non-zero exit code from the haml CLI[cite: 13].
        $badHamlFile = Join-Path $hamlSrcDir "bad.haml"
        Set-Content -Path $badHamlFile -Value "%div{invalid syntax"

        { Invoke-HamlBuild -StartPath $script:tempRoot } | 
            Should -Throw "HAML compilation failed for*"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 6: The Happy Path (Successful Compilation & Nested Folders)
    # ----------------------------------------------------------------------
    It 'Should compile HAML files to HTML successfully and preserve relative structures' -Skip:(-not (Get-Command 'haml' -ErrorAction SilentlyContinue)) {
        $hamlSrcDir = Join-Path $script:tempRoot "src/haml"
        New-Item -ItemType Directory -Path $hamlSrcDir -Force | Out-Null
        
        $nestedSrcDir = Join-Path $hamlSrcDir "nested"
        New-Item -ItemType Directory -Path $nestedSrcDir -Force | Out-Null

        # Create a root file and a nested file to verify relative path structures[cite: 13].
        $validRootFile = Join-Path $hamlSrcDir "index.haml"
        Set-Content -Path $validRootFile -Value "%h1 Root"
        
        $validNestedFile = Join-Path $nestedSrcDir "page.haml"
        Set-Content -Path $validNestedFile -Value "%p Nested"

        { Invoke-HamlBuild -StartPath $script:tempRoot } | Should -Not -Throw

        # Verifies that the default 'dist' output folder is created[cite: 13].
        $htmlDistDir = Join-Path $script:tempRoot "dist"
        Test-Path $htmlDistDir -PathType Container | Should -BeTrue

        # Verifies root file compilation[cite: 13].
        $compiledRootFile = Join-Path $htmlDistDir "index.html"
        Test-Path $compiledRootFile -PathType Leaf | Should -BeTrue

        # Verifies nested subfolder structure preservation and compilation[cite: 13].
        $compiledNestedFile = Join-Path $htmlDistDir "nested/page.html"
        Test-Path $compiledNestedFile -PathType Leaf | Should -BeTrue
    }
}
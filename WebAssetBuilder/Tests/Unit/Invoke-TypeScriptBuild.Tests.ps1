BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force

    # Define a dummy 'tsc' function so Pester can reliably mock it 
    # even if Node/TypeScript is not installed on the CI runner
    function tsc {}
}

Describe 'Invoke-TypeScriptBuild Unit Tests' {

    BeforeEach {
        # Globally mock logging to keep the test console output clean[cite: 17]
        Mock Write-Log {}
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: TypeScript CLI is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the tsc CLI is not found' {
        # Simulate Get-Command failing to find 'tsc' in the environment[cite: 17]
        Mock Get-Command { return $null } -ParameterFilter { $Name -eq "tsc" }

        { Invoke-TypeScriptBuild -StartPath "C:\FakePath" } | 
            Should -Throw "TypeScript CLI (tsc) not found. Install via 'npm install -g typescript'."
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Find-ProjectRoot Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if the project root cannot be determined' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "tsc" }
        
        # Simulate the helper function failing to locate a root[cite: 17]
        Mock Find-ProjectRoot { return $null }

        { Invoke-TypeScriptBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: Source Directory is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "tsc" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        
        # Simulate the 'src/ts' directory missing from the file system[cite: 17]
        Mock Test-Path { return $false }

        { Invoke-TypeScriptBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'TypeScript source directory not found: C:\FakeProject\src\ts'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: No TypeScript Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "tsc" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        
        # Simulate finding zero .ts files in the directory[cite: 17]
        Mock Get-ChildItem { return @() }

        { Invoke-TypeScriptBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'No TypeScript files found in: C:\FakeProject\src\ts'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 5: tsc Compilation Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if tsc returns a non-zero exit code' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "tsc" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        Mock New-Item {}
        
        # Provide a fake file so it bypasses the empty directory check[cite: 17]
        $fakeFile = [PSCustomObject]@{ FullName = "C:\FakeProject\src\ts\app.ts" }
        Mock Get-ChildItem { return @($fakeFile) }

        # Intercept the 'tsc' call and force it to return an error code[cite: 17]
        Mock tsc { $global:LASTEXITCODE = 1 }

        { Invoke-TypeScriptBuild -StartPath "C:\FakePath" } | 
            Should -Throw 'TypeScript compilation failed for*'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 6: The Happy Path
    # ----------------------------------------------------------------------
    It 'Should execute successfully and compile files without throwing' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "tsc" }
        Mock Find-ProjectRoot { return "C:\FakeProject" }
        Mock Test-Path { return $true }
        Mock New-Item {}
        
        $fakeFile = [PSCustomObject]@{ FullName = "C:\FakeProject\src\ts\app.ts" }
        Mock Get-ChildItem { return @($fakeFile) }

        # Intercept the 'tsc' call and simulate a successful exit code[cite: 17]
        Mock tsc { $global:LASTEXITCODE = 0 }

        # The function should complete completely without throwing any exceptions[cite: 17]
        { Invoke-TypeScriptBuild -StartPath "C:\FakePath" } | Should -Not -Throw
    }
}
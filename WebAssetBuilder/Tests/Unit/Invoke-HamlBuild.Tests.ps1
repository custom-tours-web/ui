BeforeAll {
    Import-Module "$PSScriptRoot/../../WebAssetBuilder.psd1" -Force

    # Define a dummy 'haml' function so Pester can reliably mock it
    function haml {}
}

Describe 'Invoke-HamlBuild Unit Tests' {

    BeforeEach {
        # Globally mock logging inside the module to keep the test console output clean
        Mock Write-Log {} -ModuleName 'WebAssetBuilder'

        # Set up cross-platform friendly fake paths using TestDrive
        $fakePath    = Join-Path $TestDrive "FakePath"
        $fakeProject = Join-Path $TestDrive "FakeProject"
        $fakeSrcDir  = Join-Path $fakeProject "src/haml"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 1: Find-ProjectRoot Fails
    # ----------------------------------------------------------------------
    It 'Should throw an error if the project root cannot be determined' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" } -ModuleName 'WebAssetBuilder'
        
        Mock Find-ProjectRoot { return $null } -ModuleName 'WebAssetBuilder'

        { Invoke-HamlBuild -StartPath $fakePath } | 
            Should-Throw 'Project root could not be determined.'
    }

    # ----------------------------------------------------------------------
    # SCENARIO 2: Source Directory is Missing
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory does not exist' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" } -ModuleName 'WebAssetBuilder'
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        
        Mock Test-Path { return $false } -ModuleName 'WebAssetBuilder'

        { Invoke-HamlBuild -StartPath $fakePath } | 
            Should-Throw "HAML source directory not found: $fakeSrcDir"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 3: No HAML Files Found
    # ----------------------------------------------------------------------
    It 'Should throw an error if the source directory is empty' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" } -ModuleName 'WebAssetBuilder'
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        Mock Test-Path { return $true } -ModuleName 'WebAssetBuilder'
        
        # Simulate finding zero .haml files in the directory
        Mock Get-ChildItem { return @() } -ModuleName 'WebAssetBuilder'

        { Invoke-HamlBuild -StartPath $fakePath } | 
            Should-Throw "No HAML files found in: $fakeSrcDir"
    }

    # ----------------------------------------------------------------------
    # SCENARIO 4: The Happy Path
    # ----------------------------------------------------------------------
    It 'Should execute successfully and compile files without throwing' {
        Mock Get-Command { return $true } -ParameterFilter { $Name -eq "haml" } -ModuleName 'WebAssetBuilder'
        Mock Find-ProjectRoot { return $fakeProject } -ModuleName 'WebAssetBuilder'
        Mock Test-Path { return $true } -ModuleName 'WebAssetBuilder'
        Mock New-Item {} -ModuleName 'WebAssetBuilder'
        Mock Set-Content {} -ModuleName 'WebAssetBuilder' # Ensure file system remains untouched
        
        $fakeFile = [PSCustomObject]@{ 
            FullName = (Join-Path $fakeSrcDir "index.haml")
            Name = "index.haml" 
        }
        Mock Get-ChildItem { return @($fakeFile) } -ModuleName 'WebAssetBuilder'

        # Intercept the 'haml' call and simulate a successful exit code
        Mock haml { $global:LASTEXITCODE = 0; return "<h1>Hello</h1>" } -ModuleName 'WebAssetBuilder'

        # The function should complete without throwing any exceptions
        Invoke-HamlBuild -StartPath $fakePath
    }
}
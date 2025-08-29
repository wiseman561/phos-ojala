using System.Text.Json;
using Xunit;

public class ClassificationTests
{
    [Fact]
    public void LdlHigh_Is_High()
    {
        var ranges = new ReferenceRanges();
        var conv = new UnitConverter();
        var svc = new LabInterpreter(ranges, conv);

        var req = new InterpretationRequest
        {
            UserId = "u1",
            Measurements = new() { new Measurement { Code = "LDL_C", Value = 160, Unit = "mg/dL" } }
        };

        var res = svc.Interpret(req);
        Assert.Single(res.Results);
        Assert.Equal("high", res.Results[0].Severity);
    }

    [Fact]
    public void TrigMmol_Is_Normalized()
    {
        var ranges = new ReferenceRanges();
        var conv = new UnitConverter();
        var svc = new LabInterpreter(ranges, conv);

        // 1.5 mmol/L triglycerides ~ 132.7 mg/dL (normal)
        var req = new InterpretationRequest
        {
            UserId = "u1",
            Measurements = new() { new Measurement { Code = "TRIG", Value = 1.5, Unit = "mmol/L" } }
        };
        var res = svc.Interpret(req);
        Assert.Single(res.Results);
        Assert.Equal("normal", res.Results[0].Severity);
    }
}



using TTOptimizer.Web.Models.DTO.AI;

namespace TTOptimizer.Web.Services.AI;

public interface ILLMRuleInterpreterService
{
    Task<RuleInterpretationResultDto> InterpretAsync(
        RuleInterpretationRequestDto request,
        CancellationToken cancellationToken = default);
}
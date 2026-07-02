#include <../External/nlohmann/json.hpp>

using json = nlohmann::json;

class EngineResultJsonWriter
{
public:
    std::string writeSuccess(
        double initialPenalty,
        double bestPenalty,
        const Chromosome& chromosome) const
    {
        json result;

        result["success"] = true;
        result["initialPenalty"] = initialPenalty;
        result["bestPenalty"] = bestPenalty;
        result["genes"] = json::array();

        for (const auto& gene : chromosome.genes)
        {
            if (gene.has_value())
            {
                result["genes"].push_back(gene.value());
            }
            else
            {
                result["genes"].push_back(nullptr);
            }
        }

        return result.dump(2);
    }

    std::string writeError(
        const std::string& message) const
    {
        json result;

        result["success"] = false;
        result["error"] = message;

        return result.dump(2);
    }

};
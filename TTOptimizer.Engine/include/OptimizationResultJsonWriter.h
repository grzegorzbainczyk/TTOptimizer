#pragma once
class OptimizationResultJsonWriter
{
//public:
//    static void writeToFile(
//        const OptimizationResult& result,
//        const std::string& filePath) const
//    {
//        json root;
//
//        root["success"] = result.success;
//        root["initialPenalty"] = result.initialPenalty;
//        root["bestPenalty"] = result.bestPenalty;
//        root["error"] = result.error;
//        root["genes"] = json::array();
//
//        for (const auto& gene : result.genes)
//        {
//            root["genes"].push_back({
//                { "lessonRequirementId", gene.lessonRequirementId },
//                { "day", gene.day },
//                { "slot", gene.slot },
//                { "roomId", gene.roomId }
//                });
//        }
//
//        std::ofstream outputFile(filePath);
//
//        if (!outputFile.is_open())
//        {
//            throw std::runtime_error("Cannot open output JSON file: " + filePath);
//        }
//
//        outputFile << root.dump(2);
//    }
};


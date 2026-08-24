#pragma once

#include <condition_variable>
#include <functional>
#include <future>
#include <memory>
#include <mutex>
#include <queue>
#include <stdexcept>
#include <thread>
#include <type_traits>
#include <utility>
#include <vector>

class ThreadPool
{
public:
    explicit ThreadPool(unsigned int threadCount = std::thread::hardware_concurrency());
    ~ThreadPool();

    ThreadPool(const ThreadPool&) = delete;
    ThreadPool& operator=(const ThreadPool&) = delete;
    ThreadPool(ThreadPool&&) = delete;
    ThreadPool& operator=(ThreadPool&&) = delete;

    [[nodiscard]] std::size_t size() const noexcept { return workers.size(); }

    template <typename Function>
    auto enqueue(Function&& function) -> std::future<std::invoke_result_t<Function>>
    {
        using ReturnType = std::invoke_result_t<Function>;

        auto task = std::make_shared<std::packaged_task<ReturnType()>>(std::forward<Function>(function));
        std::future<ReturnType> future = task->get_future();

        {
            std::lock_guard<std::mutex> lock(queueMutex);

            if (stopping)
            {
                throw std::runtime_error("Cannot enqueue a task on a stopped ThreadPool.");
            }

            tasks.emplace([task]() { (*task)(); });
        }

        taskAvailable.notify_one();
        return future;
    }

private:
    void workerLoop();

    std::mutex queueMutex;
    std::condition_variable taskAvailable;
    std::queue<std::function<void()>> tasks;
    bool stopping = false;
    std::vector<std::jthread> workers;
};

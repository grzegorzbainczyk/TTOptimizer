#include "Optimization/ThreadPool.h"

#include <algorithm>

ThreadPool::ThreadPool(unsigned int threadCount)
{
    threadCount = std::max(1u, threadCount);
    workers.reserve(threadCount);

    for (unsigned int index = 0; index < threadCount; ++index)
    {
        workers.emplace_back([this]() { workerLoop(); });
    }
}

ThreadPool::~ThreadPool()
{
    {
        std::lock_guard<std::mutex> lock(queueMutex);
        stopping = true;
    }

    taskAvailable.notify_all();

    // Clearing the vector destroys the std::jthread objects and joins all worker threads
    // while the mutex, condition variable and task queue are still alive.
    workers.clear();
}

void ThreadPool::workerLoop()
{
    while (true)
    {
        std::function<void()> task;

        {
            std::unique_lock<std::mutex> lock(queueMutex);
            taskAvailable.wait(lock, [this]() { return stopping || !tasks.empty(); });

            if (stopping && tasks.empty())
            {
                return;
            }

            task = std::move(tasks.front());
            tasks.pop();
        }

        task();
    }
}

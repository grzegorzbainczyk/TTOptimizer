// Returns unique, non-empty, sorted values from a list.
function getUniqueSortedValues(items, selector) {
    return [...new Set(
        items
            .map(selector)
            .filter(value => value)
    )].sort();
}

// Clears a select element and adds the default "All ..." option.
function resetFilter(selectElement, defaultText) {
    selectElement.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultText;

    selectElement.appendChild(defaultOption);
}

// Fills a select element with options based on provided values.
function populateFilter(selectElement, values, defaultText) {
    resetFilter(selectElement, defaultText);

    for (const value of values) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;

        selectElement.appendChild(option);
    }
}

// Fills the class dropdown.
function populateClassFilter(classFilter, lessons) {
    const classNames = getUniqueSortedValues(
        lessons,
        lesson => lesson.classGroup
    );

    populateFilter(classFilter, classNames, "All classes");
}

// Fills the teacher dropdown.
function populateTeacherFilter(teacherFilter, lessons) {
    const teachers = getUniqueSortedValues(
        lessons,
        lesson => lesson.teacher
    );

    populateFilter(teacherFilter, teachers, "All teachers");
}

// Fills the room dropdown.
function populateRoomFilter(roomFilter, lessons) {
    const rooms = getUniqueSortedValues(
        lessons,
        lesson => lesson.room
    );

    populateFilter(roomFilter, rooms, "All rooms");
}

function getFilteredLessons(lessons) {
    const selectedClass = classFilter.value;
    const selectedTeacher = teacherFilter.value;
    const selectedRoom = roomFilter.value;

    return lessons.filter(lesson => {
        const matchesClass =
            !selectedClass || lesson.classGroup === selectedClass;

        const matchesTeacher =
            !selectedTeacher || lesson.teacher === selectedTeacher;

        const matchesRoom =
            !selectedRoom || lesson.room === selectedRoom;

        return matchesClass && matchesTeacher && matchesRoom;
    });
}
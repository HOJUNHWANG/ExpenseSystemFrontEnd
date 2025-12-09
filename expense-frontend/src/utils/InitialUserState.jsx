

export const getInitialUserState = () => {
    try {
        const saved = localStorage.getItem('expense-user');
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Error loading user from localStorage:", error);
        return null;
    }
};
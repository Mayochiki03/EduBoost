import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Welcome from "./pages/Welcome.jsx";
import TeacherLogin from "./pages/TeacherLogin.jsx";
import StudentJoin from "./pages/StudentJoin.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import ClassroomPage from "./pages/ClassroomPage.jsx";
import GradingPage from "./pages/GradingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import QuizAttemptPage from "./pages/QuizAttemptPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<TeacherLogin />} />
        <Route path="/join" element={<StudentJoin />} />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classrooms/:id"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin"]}>
              <ClassroomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments/:id"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin"]}>
              <GradingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quizzes/:id/attempt"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <QuizAttemptPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

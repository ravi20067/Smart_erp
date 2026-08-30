import api from "@/services/axiosConfig";
import { getBaseUrl } from "@/services/authutil";
import { useNavigate } from "react-router-dom";

const baseUrl = getBaseUrl();

/*
|--------------------------------------------------------------------------
| Get All Universities
|--------------------------------------------------------------------------
| GET /admin/university
*/
export const getAllUniversities = async () => {
    const response = await api.get(`${baseUrl}/university`);
    return response.data;
};


/*
|--------------------------------------------------------------------------
| Get University By ID
|--------------------------------------------------------------------------
| GET /admin/university/{id}
*/
export const getUniversityById = async (id) => {
    const response = await api.get(
        `${baseUrl}/university/${id}`
    );

    return response.data;
};


/*
|--------------------------------------------------------------------------
| Create University
|--------------------------------------------------------------------------
| POST /admin/university?name=ABC University
|
| IMPORTANT:
| The backend expects name as a request parameter,
| NOT as JSON body.
*/
export const createUniversity = async (name) => {
    const response = await api.post(
        `${baseUrl}/university`,
        null,
        {
            params: {
                name,
            },
        }
    );

    return response.data;
};


/*
|--------------------------------------------------------------------------
| Update University
|--------------------------------------------------------------------------
| PUT /admin/university/{universityId}
|
| Body:
| {
|     name: "...",
|     deanId: 10
| }
*/
export const updateUniversity = async (
    universityId,
    data
) => {
    const response = await api.put(
        `${baseUrl}/university/${universityId}`,
        data
    );

    return response.data;
};


/*
|--------------------------------------------------------------------------
| Delete University
|--------------------------------------------------------------------------
| DELETE /admin/university/{universityId}
*/
export const deleteUniversity = async (universityId) => {
    const response = await api.delete(
        `${baseUrl}/university/${universityId}`
    );

    return response.data;
};


/*
|--------------------------------------------------------------------------
| Get Teachers For Dean
|--------------------------------------------------------------------------
| GET /admin/common/teacher?universityId={id}
*/
export const getTeachersForDean = async (universityId) => {
    const response = await api.get(
        `${baseUrl}/common/teacher`,
        {
            params: {
                universityId,
            },
        }
    );

    return response.data;
};


export default api;
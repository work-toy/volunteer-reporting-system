USE gaokao;

DROP PROCEDURE IF EXISTS sp_search_university_by_score;

DELIMITER //
CREATE PROCEDURE sp_search_university_by_score(IN p_score INT)
BEGIN
    SELECT id, name, ranking, description, min_score, province
    FROM university
    WHERE min_score IS NOT NULL AND min_score BETWEEN p_score - 50 AND p_score + 20
    ORDER BY min_score DESC, ranking ASC;
END //
DELIMITER ;

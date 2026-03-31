package aemwebmcp.core.servlets;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SearchServletInitTest {

    @Test
    void testInit() {
        SearchServlet servlet = new SearchServlet();
        assertNotNull(servlet);
    }
}

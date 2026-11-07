package aemwebmcp.core.services;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ContentFragmentGraphQLServiceTest {
    private ContentFragmentGraphQLService service(String url, boolean mockData) {
        var config = mock(ContentFragmentGraphQLService.Config.class);
        when(config.use_mockData()).thenReturn(mockData);
        when(config.use_persistedQueries()).thenReturn(true);
        when(config.persisted_query_url()).thenReturn(url);
        var service = new ContentFragmentGraphQLService();
        service.activate(config);
        return service;
    }

    @Test
    void realModeCannotReturnMockListsOrUseAnUnconfiguredEndpoint() {
        var service = service("", false);
        assertThrows(IllegalStateException.class, () -> service.fetchContentFragment("/content/dam/demo/article"));
        assertThrows(IllegalStateException.class, () -> service.fetchContentFragmentsByModel("article", 10, 0));
        assertEquals(true, service("", true).fetchContentFragment("/content/dam/demo/article").get("demo"));
    }

    @Test
    void endpointConfigurationRejectsCredentialsQueriesAndNonLocalHttp() {
        for (String url : new String[] {
                "https://user:password@example.com/graphql/execute.json/demo/article",
                "https://example.com/graphql/execute.json/demo/article?query=anything",
                "http://example.com/graphql/execute.json/demo/article",
                "https://example.com/content/graphql/global/endpoint.json" }) {
            assertThrows(IllegalStateException.class,
                    () -> service(url, false).fetchContentFragment("/content/dam/demo/article"));
        }
    }

    @Test
    void executesFixedGetWithEncodedVariablesAndPropagatesUpstreamFailures() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var body = new AtomicReference<>("{\"data\":{\"fragment\":{\"item\":{\"_path\":\"/content/dam/demo/article\",\"title\":\"Published article\"}}}}");
        var status = new AtomicInteger(200);
        var requests = new AtomicInteger();
        var method = new AtomicReference<String>();
        var path = new AtomicReference<String>();
        server.createContext("/graphql/execute.json/demo/article", exchange -> {
            requests.incrementAndGet();
            method.set(exchange.getRequestMethod());
            path.set(exchange.getRequestURI().getRawPath());
            byte[] bytes = body.get().getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status.get(), bytes.length);
            try (var output = exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        try {
            var service = service("http://127.0.0.1:" + server.getAddress().getPort()
                    + "/graphql/execute.json/demo/article", false);
            String fragment = "/content/dam/demo/article";
            assertEquals("Published article", service.fetchContentFragment(fragment).get("title"));
            assertEquals(false, service.fetchContentFragment(fragment).get("demo"));
            assertEquals(2, requests.get(), "The adapter must not maintain its own cache");
            assertEquals("GET", method.get());
            assertTrue(path.get().endsWith("%3Bpath%3D%2Fcontent%2Fdam%2Fdemo%2Farticle"));
            body.set("{\"errors\":[{\"message\":\"Query failed\"}]}");
            assertThrows(IllegalStateException.class, () -> service.fetchContentFragment(fragment));
            body.set("{\"data\":{\"fragment\":{\"item\":null}}}");
            assertTrue(service.fetchContentFragment(fragment).isEmpty());
            body.set("{\"data\":{\"wrongAlias\":{\"item\":{}}}}");
            assertThrows(IllegalStateException.class, () -> service.fetchContentFragment(fragment));
            status.set(503);
            assertThrows(IllegalStateException.class, () -> service.fetchContentFragment(fragment));
        } finally {
            server.stop(0);
        }
    }
}

import PropTypes from "prop-types";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/custom/spinner";

/**
 * Wrapper component that handles error and loading states
 * Shows appropriate UI while loading or when errors occur
 * @param {Object} props - Component props
 * @param {Error} props.error - Error object if an error occurred
 * @param {boolean} props.loading - Whether data is loading
 * @param {string} props.resourceName - Name of resource being loaded (e.g., "users", "projects")
 * @param {React.ReactNode} props.children - Content to show when loaded successfully
 */
export function ErrorLoadingWrapper({ error, loading, resourceName = "data", children }) {
  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="text-red-700">
          Error loading {resourceName}: {error.message}
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  // Show children when loaded successfully
  return children;
}

ErrorLoadingWrapper.propTypes = {
  error: PropTypes.instanceOf(Error),
  loading: PropTypes.bool.isRequired,
  resourceName: PropTypes.string,
  children: PropTypes.node.isRequired,
};